import React, { useState, useEffect } from "react";
import { parseCookies } from "nookies";
import Select from "react-select";
import { useQuery } from "react-query";

import SongPurchaseView from "../../components/song-purchase";
import Footer from "../../components/footer";
import Header from "../../components/header";

const getPurchaseSong = async (key) => {
  const cookies = parseCookies();
  const token = cookies.auth;

  const songKey = key.queryKey[1].song;
  const getUser = await fetch(`${process.env.URL}/api/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const userInfo = await getUser.json();

  if (songKey) {
    const response = await fetch(
      `${process.env.URL}/api/orders?populate[song][populate]=*&filters[users][id]=${userInfo.id}&filters[song][title][$eq]=${songKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      }
    );
    return await response.json();
  }

  //default query
  const res = await fetch(
    `${process.env.URL}/api/orders?populate[song][populate]=*&filters[users][id]=${userInfo.id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
      },
    }
  );

  return res.json();
};

function user({ songs }) {
  const [song, setSong] = useState("");
  const [page, setPage] = useState(1);

  const [prevDisabled, setPrevDisabled] = useState(false);
  const [nextDisabled, setNextDisabled] = useState(false);



  const { data, error } = useQuery(
    ["userPurchase", { song: song }],
    getPurchaseSong,
    { initialData: songs }
  );
  
  
  useEffect(() => {

    if(page=== 1){
      setPrevDisabled(true);
    }else{
      setPrevDisabled(false)
    }



    if(data.meta.pagination.pageCount === page){
      setNextDisabled(true);
    }else(
      setNextDisabled(false)
    )

  },[data])


  console.log(songs)


  const list = data.data.map((song, index) => {

    return (
      <SongPurchaseView
        song_title={song.attributes.song.data.attributes.title}
        artist_text={
          song.attributes.song.data.attributes.artist.data.attributes.firstName
        }
        song_album_text={
          song.attributes.song.data.attributes.album.data.attributes.title
        }
        resource_text={song.attributes.song.data.attributes.Resources.map(
          (e) => e.type
        )}
      />
    );
  });

  const songOptions = songs.data.map((song) => {
    return {
      value: song.attributes.song.data.attributes.title,
      label: song.attributes.song.data.attributes.title,
    };
  });

  return (
    <>
      <div className="container">
        <Header rootClassName="rootClassName3"></Header>
        <div className="page-title">
          <h1>Purchase Songs</h1>
        </div>
        <div className="purchase-song-container">
          <div className="filter-song-container">
            <span className="select-option-label-wrapper">Filter Songs</span>
            <div className="select-option-wrapper">
              <Select
                options={songOptions}
                instanceId="songs"
                placeholder="Songs Filter"
                onChange={(e) => setSong(e?.value)}
                isClearable
              />
            </div>
          </div>
          <div className="purchase-songs">{list}</div>
          <div className="pagination-button">
              <button className="prev-button button" disabled={prevDisabled} onClick={()=>setPage(page - 1)}>Previous</button>
              <button className="next-button button" disabled={nextDisabled} onClick={()=>setPage(page + 1)}>Next</button>
            </div>
        </div>
        <Footer rootClassName="rootClassName3"></Footer>
      </div>
      <style jsx>
        {`
          .container {
            width: 100%;
            display: flex;
            overflow: auto;
            min-height: 100vh;
            align-items: center;
            flex-direction: column;
            justify-content: flex-start;
          }
          .page-title {
            flex: 0 0 auto;
            width: 100%;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .purchase-song-container {
            flex: 0 0 auto;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: center;
          }
          .purchase-songs {
            flex: 0 0 auto;
            width: 70%;
            display: flex;
            align-items: center;
            flex-direction: column;
            grid-column: 2;
            padding-top: var(--dl-space-space-halfunit);
            border-color: rgba(89, 89, 89, 0.25);
            border-width: 1px;
            padding-left: var(--dl-space-space-twounits);
            padding-right: var(--dl-space-space-twounits);
            padding-bottom: var(--dl-space-space-halfunit);
            justify-content: flex-start;
            border-top-width: 0px;
            border-left-width: 0px;
            border-right-width: 0px;
            border-bottom-width: 1px;
          }

          @media (max-width: 991px) {
            .purchase-songs {
              width: 100%;
            }
          }
          @media (max-width: 767px) {
            .purchase-songs {
              border-radius: 20px;
            }
          }
          @media (max-width: 479px) {
            .purchase-songs {
              padding: var(--dl-space-space-halfunit);
            }
          }
        `}
      </style>
    </>
  );
}

export async function getServerSideProps(context) {
  const cookies = parseCookies(context).auth

  const getUser = await fetch(`${process.env.URL}/api/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cookies}`,
    },
  });

  const userInfo = await getUser.json();

  
  //TODO: create a policy to only allow users to see their own orders via the API id
  const res = await fetch(
    `${process.env.URL}/api/orders?populate[song][populate]=*&filters[users][id]=${userInfo.id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
      },
    }
  );

  const songs = await res.json();
  if (!userInfo.id) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      songs,
    },
  };
}

export default user;
